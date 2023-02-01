import {UserEntity} from "../entities/user.entity";
import {BuyCourseSagaState} from "./buy-course.state";
import {CourseGetCourse, PaymentCheck, PaymentGenerateLink, PaymentStatus} from "@purple/contracts";
import {PurchaseState} from "@purple/interfaces";

export class BuyCourseSagaStateStarted extends BuyCourseSagaState {
  public async cencel(): Promise<{ user: UserEntity }> {
    this.saga.setState(PurchaseState.Cenceled, this.saga.courseId)
    return {user: this.saga.user};
  }

  public checkPayment(): Promise<{ user: UserEntity,status:PaymentStatus}> {
    throw new Error('You can\'t check a payment that has just started ')
  }

  public async pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    const {course} = await this.saga.rmqService.send<CourseGetCourse.Request, CourseGetCourse.Response>(CourseGetCourse.topic, {
      id: this.saga.courseId
    });
    if (!course) {
      throw new Error("Course wasn't find")
    }
    if (course.price == 0) {
      this.saga.setState(PurchaseState.Purchased, course._id);
      return {paymentLink: null, user: this.saga.user}
    }
    const {paymentLink} = await this.saga.rmqService.send<PaymentGenerateLink.Request, PaymentGenerateLink.Response>(PaymentGenerateLink.topic, {
      courseId: course._id,
      userId: this.saga.user._id,
      sum: course.price,
    })
    this.saga.setState(PurchaseState.WaitingForPayment, course._id);
    return {paymentLink, user: this.saga.user}
  }

}

export class BuyCourseSagaStateProcess extends BuyCourseSagaState {
  public cencel(): Promise<{ user: UserEntity }> {
    throw new Error('You can\'t do it in process ')
  }

  public async checkPayment(): Promise<{ user: UserEntity ,status:PaymentStatus}> {
    const {status} = await this.saga.rmqService.send<PaymentCheck.Request, PaymentCheck.Response>(PaymentCheck.topic, {
      userId: this.saga.user._id,
      courseId: this.saga.courseId
    })
    if (status == 'canceled') {
      this.saga.setState(PurchaseState.Cenceled, this.saga.courseId)
      return {user: this.saga.user,status:'canceled'}
    }
    if (status !== 'success') {
      return {user: this.saga.user,status:'success'}
    }
    this.saga.setState(PurchaseState.Purchased, this.saga.courseId);
    return {user: this.saga.user,status:'progress'}
  }

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('You can\'t get a payment link that has just process ')
  }

}

export class BuyCourseSagaStateFinished extends BuyCourseSagaState {
  public cencel(): Promise<{ user: UserEntity }> {
    throw new Error('You can\'t do it')
  }

  public checkPayment(): Promise<{ user: UserEntity,status:PaymentStatus }> {
    throw new Error('You can\'t do it')
  }

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    throw new Error('You can\'t do it')
  }

}

export class BuyCourseSagaStateCanceled extends BuyCourseSagaState {
  public cencel(): Promise<{ user: UserEntity }> {
    throw new Error('You can\'t do it')
  }

  public checkPayment(): Promise<{ user: UserEntity,status:PaymentStatus }> {
    throw new Error('You can\'t do it')
  }

  public pay(): Promise<{ paymentLink: string; user: UserEntity }> {
    this.saga.setState(PurchaseState.Started, this.saga.courseId)
    return this.saga.getState().pay();
  }

}
