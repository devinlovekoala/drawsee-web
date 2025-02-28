import alova from "@/api";

export const login =
  (username: string, password: string) =>
    alova.Post('/user/login', {
      username: username,
      password: password
    });

export const signup =
  (username: string, password: string) =>
    alova.Post('/user/signup', {
      username: username,
      password: password
    });

export const checkLogin =
  () => alova.Get('/user/check_login');