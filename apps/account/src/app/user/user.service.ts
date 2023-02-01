import {Body, Injectable} from "@nestjs/common";
import {AccountBuyCourse, AccountChangeProfile, AccountCheckPayment} from "@purple/contracts";
import {UserEntity} from "./entities/user.entity";
import {UserRepository} from "./repositories/user.repository";
import {IUser} from "@purple/interfaces";
import {RMQService} from "nestjs-rmq";
import {BuyCourseSaga} from "./sagas/buy-course.saga";
import {UserEventEmmitter} from "./user.event-immitter";


@Injectable()
export class UserService{
  constructor(
    private readonly userRepository: UserRepository,
    private readonly rmqService: RMQService,
    private readonly userEventEmmitter:UserEventEmmitter
  ) {
  }
  public async changeProfile(user:Pick<IUser, 'displayName'>,id:string) {
    const existedUser = await this.userRepository.findUserById(id);
    if (!existedUser) {
      throw new Error("User wasn't find");
    }
    const userEntity = new UserEntity(existedUser).updateProfile(user.displayName);
    await this.updateUser(userEntity)
    return {};
  }
  public async buyCourse(userId:string,courseId:string): Promise<AccountBuyCourse.Response> {
    const existedUser = await this.userRepository.findUserById(userId);
    if (!existedUser) {
      throw new Error('User wasn\'t find ')
    }
    const userEntity = new UserEntity(existedUser)
    const saga = new BuyCourseSaga(userEntity, this.rmqService, courseId);
    const {user, paymentLink} = await saga.getState().pay()
    await this.updateUser(user)
    return {paymentLink}
  }
  public async checkPayment(userId:string,courseId:string): Promise<AccountCheckPayment.Response> {
    const existedUser = await this.userRepository.findUserById(userId);
    if (!existedUser) {
      throw new Error('User wasn\'t find ')
    }
    const userEntity = new UserEntity(existedUser);
    const saga = new BuyCourseSaga(userEntity, this.rmqService, courseId);
    const {user,status}= await  saga.getState().checkPayment();
    await this.updateUser(user)
    return {status}
  }
  private updateUser(user:UserEntity){
    return Promise.all([
      this.userEventEmmitter.handle(user),
      this.userRepository.updateUser(user)
    ])
  }
}
