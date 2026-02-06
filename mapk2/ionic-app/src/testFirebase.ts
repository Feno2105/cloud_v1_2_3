import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase"; // ajuste le chemin si nécessaire

const testRegister = async () => {
  const email = "safidy@gmail.com";
  const password = "123456";

  try {
    const user = await createUserWithEmailAndPassword(auth, email, password);
    console.log("Utilisateur créé :", user);
    alert("Inscription test réussie !");
  } catch (err: any) {
    console.error(err.code, err.message);
    alert("Erreur : " + err.message);
  }
};

testRegister();
