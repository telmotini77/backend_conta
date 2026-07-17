export class SignupDto {
  email!: string;
  password!: string;
  name!: string;
  ruc!: string;
  address?: string;
  province?: string;
  city?: string;
  whatsapp?: string;
  businessTypes?: string[];
}

export class LoginDto {
  email!: string;
  password!: string;
}
