import { User } from "lucia";
import { headers } from "next/headers";

/**
 * This method checks if the user is allowed to access the current requested page
 * @param user logged in user
 * @returns {Promise<boolean>} true if allowed and false if not
 */
export async function accessAllowed(user: User | null): Promise<boolean> {
    const headerList = headers();
    const pathSegments = headerList.get("x-current-path")?.split("/") ?? []
    const path = pathSegments.length > 1 ? `/${pathSegments[1]}` : "/"
  
    switch(path) {
      // Allowed regardless of user logged in or not
      case "":
      case "/":
        return true
  
      // Allowed when user is not logged in
      case "/signin":
      case "/signup":
        return !user
  
      // Allowed when user is logged in
      case "/transcriptions":
      case "/record":
        return !!user
      
      // Allowed when user is logged in and has role 'hr'
      case "/analysis":
      case "/analyse":
        return user?.role === "hr"
  
      // Denied in all other cases
      default:
        return false
    }
  }