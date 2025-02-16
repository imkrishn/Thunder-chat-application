import { account } from "@/app/(root)/appwrite";



export async function getAuthUser() {
  try {
    const session = await account.get();
    return session;
  } catch (error) {
    console.log(error);

    return null;
  }
}