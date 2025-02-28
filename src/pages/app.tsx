import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { checkLogin } from "../api/methods/auth.methods.ts";
import { LOGIN_FLAG_KEY } from "../common/constant/storage-key.constant.ts";
import { toast } from "sonner";
import { Toaster } from "@/common/components/ui/sonner";
import { Box, Button, Typography, styled } from "@mui/material";

const AppContainer = styled(Box)({
  width: "100vw",
  height: "100vh",
  display: "flex",
});

const LeftSection = styled(Box)({
  width: "60%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  color: "#FFFFFF",
  textAlign: "center",
  padding: "2rem",
  position: "relative",
  background: "linear-gradient(135deg, #007BFF, #0048BA)",
  backgroundImage: "url('/background.png')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundBlendMode: "overlay",
  opacity: 0.7,
});

const RightSection = styled(Box)({
  width: "40%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  background: "#FAF3E0",
  padding: "2rem",
  position: "relative",
});

const NavBar = styled(Box)({
  position: "absolute",
  top: "20px",
  right: "40px",
  display: "flex",
  gap: "20px",
});

const NavButton = styled(Button)({
  color: "#333",
  textTransform: "none",
  fontSize: "16px",
  fontWeight: "500",
  borderBottom: "2px solid transparent",
  transition: "all 0.3s",
  "&:hover": {
    borderBottom: "2px solid #007BFF",
    color: "#007BFF",
  },
});

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const loginFlag = sessionStorage.getItem(LOGIN_FLAG_KEY);
    if (!loginFlag) {
      checkLogin()
          .then(() => {
            sessionStorage.setItem(LOGIN_FLAG_KEY, "true");
            toast.info("欢迎回来");
          })
          .catch(() => {
            toast.error("未登录，请先登录");
          });
    }
  }, [navigate]);

  return (
      <>
        <AppContainer>
          <LeftSection>
            <Typography variant="h3" fontWeight="bold" color="#000">
              昭析——大模型赋能的可视化智能体平台
            </Typography>
            <Typography
                variant="h4"
                sx={{
                  fontStyle: "italic",
                  fontWeight: "bold",
                  mt: 1,
                  textAlign: "right",
                  color: "#FFF",
                }}
            >
              DrawSee
            </Typography>
          </LeftSection>

          <RightSection>
            <NavBar>
              <NavButton onClick={() => window.open("/about", "_blank")}>
                关于我们
              </NavButton>
              <NavButton onClick={() => navigate("/admin")}>后台管理</NavButton>
            </NavBar>
            <Box display="flex" gap={2}>
              <Button variant="contained" color="primary" onClick={() => navigate("/auth/login")}>
                登录
              </Button>
              <Button variant="outlined" color="primary" onClick={() => navigate("/auth/signup")}>
                注册
              </Button>
            </Box>
          </RightSection>
        </AppContainer>

        <Toaster />
      </>
  );
}

export default App;