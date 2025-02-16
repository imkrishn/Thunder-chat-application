import { useState, useEffect } from "react";
import { account, databases } from "@/app/(root)/appwrite";
import { Query } from "appwrite";

const useLoggedInUser = () => {
  const [loggedInUserId, setLoggedInUserId] = useState<string>('');
  const [loggedInUserName, setLoggedInUserName] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getLoggedInUser() {
      try {
        const result = await account.get();

        const loggedInUser = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USER!,
          [Query.equal("mobile", result.phone.slice(1))]
        );


        if (loggedInUser.documents.length > 0) {
          setLoggedInUserId(loggedInUser.documents[0].$id);
          setLoggedInUserName(loggedInUser.documents[0].fullName)
        } else {
          throw new Error("User not found");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    getLoggedInUser();
  }, []);

  return { loggedInUserId, loggedInUserName, loading, error };
};

export default useLoggedInUser;
