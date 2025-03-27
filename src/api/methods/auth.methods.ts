import alova from "@/api";
import {LoginVO, UserSignUpDTO} from "@/api/types/auth.types.ts";

export const login =
  (username: string, password: string) =>
    alova.Post<LoginVO>('/user/login', {
      username: username,
      password: password
    });

export const signup =
  (userSignUpDTO: UserSignUpDTO) =>
    alova.Post<LoginVO>('/user/signup', userSignUpDTO);

export const checkLogin =
  () => alova.Get<LoginVO>('/user/check_login');