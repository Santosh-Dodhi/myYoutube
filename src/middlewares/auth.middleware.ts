import { IUser, User } from "../models/user.models";
import { ApiError } from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: IUser;
}

const jwtVerify = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", ""); //using req.header if the request is coming from mobile devices
  
    if(!token){
      throw new ApiError(400, "Unauthorized Request");
    }
  
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;
  
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
  
    if (!user){
      throw new ApiError(401, "Invalid Access Token.")
    }
  
    req.user = user;
    next()
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid Access Token.",)
    }     

})

export {jwtVerify}