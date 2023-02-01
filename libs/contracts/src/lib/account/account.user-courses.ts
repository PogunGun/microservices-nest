import {IUser, IUserCourses} from "@purple/interfaces";
import { IsEmail } from "class-validator";

export namespace AccountUserCourses{
  export const topic= 'account.user-courses.query'
  export class Request{
    @IsEmail()
    id: string

  }
  export class Response{
   courses:IUserCourses[]
  }
}
