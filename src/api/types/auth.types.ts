export interface UserSignUpDTO {
  username: string;
  password: string;
  // 邀请码
  invitationCode: string;
}

export interface LoginVO {
  token: string;
  username: string;
  aiTaskCount: number;
  aiTaskLimit: number;
}