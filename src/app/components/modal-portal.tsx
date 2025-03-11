import {ReactNode} from "react";

interface ModalPortalProps {
  visible: boolean;
  children: ReactNode;
}

function ModalPortal ({visible, children}: ModalPortalProps) {
  return (
    <div
      className="modelportal-overlay z-50 justify-between items-center"
      style={{
        display: visible ? "flex" : "none",
        visibility: visible ? "visible" : "hidden",
        position: "fixed",
        top: 0, right: 0, bottom: 0, left: 0,
        background: "rgba(0, 0, 0, 0.3)"
      }}
    >
      <div
        className="modelportal-container"
        style={{ margin: "auto auto" }}
      >
        {children}
      </div>
    </div>
  );
}

export default ModalPortal;