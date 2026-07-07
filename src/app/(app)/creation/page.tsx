import { redirect } from "next/navigation";

export default function CreationRedirect() {
  redirect("/conception?onglet=creer");
}
