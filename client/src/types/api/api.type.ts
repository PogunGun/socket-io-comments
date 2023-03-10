export interface IRegister {
  email: string;
  password: string;
  name: string;
}

export interface ILogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  jwt: string;
  id: string;
}
