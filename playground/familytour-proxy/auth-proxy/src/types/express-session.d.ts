import "express-session";

declare module "express-session" {
  interface SessionData {
    authenticated?: boolean;
    email?: string;
    name?: string;
    groups?: string[];
  }
}
