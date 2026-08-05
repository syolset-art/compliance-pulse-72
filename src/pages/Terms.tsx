import { Navigate } from "react-router-dom";

export default function Terms() {
  return <Navigate to="/legal?doc=terms" replace />;
}
