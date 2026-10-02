export type User = {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  fullName: string | null;
  mobileNumber: string | null;
  dateOfBirth: string | null;
  age: number | null;
  preferredVenue: {
    id: number;
    slug: string;
    name: string;
    city: string;
  } | null;
  profileComplete: boolean;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  data: {
    user: User;
    token: string;
  };
};

export type RegisterData = {
  username: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  avatar?: File;
};
