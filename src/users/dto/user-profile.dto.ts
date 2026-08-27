export class UserProfileDto {
  id: string;
  email: string;
  isVerified: boolean;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}
