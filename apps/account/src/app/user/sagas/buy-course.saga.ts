import {UserEntity} from "../entities/user.entity";
import {RMQService} from "nestjs-rmq";
import {PurchaseState} from "@purple/interfaces";
import {BuyCourseSagaState} from "./buy-course.state";
import {
  BuyCourseSagaStateCanceled,
  BuyCourseSagaStateFinished,
  BuyCourseSagaStateProcess,
  BuyCourseSagaStateStarted
} from "./buy-course.steps";


export class BuyCourseSaga {
  private state: BuyCourseSagaState

  constructor(
    public user: UserEntity,
    public rmqService: RMQService,
    public courseId: string,
  ) {
  }

  setState(state: PurchaseState, courseId: string) {
    switch (state) {
      case PurchaseState.Started:
        this.state= new BuyCourseSagaStateStarted();
        break;
      case PurchaseState.WaitingForPayment:
        this.state= new BuyCourseSagaStateProcess()
        break;
      case PurchaseState.Purchased:
        this.state= new BuyCourseSagaStateFinished()
        break;
      case PurchaseState.Cenceled:
        this.state= new BuyCourseSagaStateCanceled()
        break;
    }
    this.state.setContext(this)
    this.user.setCourseStatus(courseId, state)
  }

  getState() {
    return this.state
  }
}
