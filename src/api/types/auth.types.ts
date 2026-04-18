export interface UserSignUpDTO {
  username: string;
  password: string;
}

export interface LoginVO {
  token: string;
  username: string;
  aiTaskCount: number;
  aiTaskLimit: number;
}