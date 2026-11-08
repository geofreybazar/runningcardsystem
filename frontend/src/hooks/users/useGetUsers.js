import { useQuery } from "@tanstack/react-query";
import userService from "@/service/user.service.js";

const useGetUsers = () => useQuery({ queryKey: ["users"], queryFn: userService.getUsers });

export default useGetUsers;
