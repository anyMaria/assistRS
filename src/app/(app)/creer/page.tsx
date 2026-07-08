import { redirect } from "next/navigation";

export default function CreerRedirect() {
  redirect("/conception?generer=1");
}
