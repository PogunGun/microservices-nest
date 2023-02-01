import {IUser, IUserCourses, UserRole} from "@purple/interfaces";
import {IsString,IsEmail} from 'class-validator'
export namespace AccountChangeProfile{
  export const topic= 'account.change-profile .command'
  export class Request{
    @IsString()
    id:string
    @IsString()
    user: Pick<IUser, 'displayName'>
  }
  export class Response{
  }
}
