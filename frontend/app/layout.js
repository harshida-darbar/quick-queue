import { AuthProvider } from "./context/Authcontext";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-white">
        <AuthProvider>
        {children}
        <ToastContainer position="top-center" autoClose={1000}/>
        </AuthProvider>
      </body>
    </html>
  );
}
