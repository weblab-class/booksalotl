// import { CsvFile } from "../../models/CsvFile";
import { User } from "../../models/User";
declare module "express-serve-static-core" {
  interface Request {
    user?: User;
    file?: Express.Multer.File;
  }
}
