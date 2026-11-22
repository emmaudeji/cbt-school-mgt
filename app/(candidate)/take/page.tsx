import { urls } from "@/constants";
import { redirect } from "next/navigation";

export default function Page() {
 redirect(urls.home)
}