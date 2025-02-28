import { Box } from "@mui/material";

function About() {
    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#f4f4f4",
            }}
        >
            <iframe
                src="https://bcn290wiug78.feishu.cn/wiki/FDF5wNR2AiVj8Jkqvw7czV5RnWf"
                width="90%"
                height="90%"
                style={{
                    border: "none",
                    borderRadius: "10px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
            />
        </Box>
    );
}

export default About;
