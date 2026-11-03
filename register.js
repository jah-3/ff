document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("register-form");
    const verificationForm = document.getElementById(
        "register-verification-form"
    );
    const registerMessage = document.getElementById("register-message");
    const resendCodeButton = document.getElementById("register-resend-code");
    let verificationEmail = "";

    verificationForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const token = document.getElementById("register-code").value.trim();
        registerMessage.style.color = "#fecdd3";
        registerMessage.textContent = "Verifying your email...";

        try {
            await window.signupVerification.verify(verificationEmail, token);
            registerMessage.style.color = "#a7f3d0";
            registerMessage.textContent =
                "Email verified. You can now sign in with your new account.";
            verificationForm.hidden = true;
        } catch (error) {
            console.error("Could not verify signup email:", error);
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent =
                error.message || "Could not verify the email code.";
        }
    });

    resendCodeButton.addEventListener("click", async function () {
        resendCodeButton.disabled = true;
        registerMessage.style.color = "";
        registerMessage.textContent = "Sending a new verification code...";

        try {
            await window.signupVerification.resend(verificationEmail);
            registerMessage.style.color = "#a7f3d0";
            registerMessage.textContent =
                "If the address can receive a verification code, a new one has been sent. Check your inbox and spam folder.";
        } catch (error) {
            console.error("Could not resend signup verification code:", error);
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent =
                error.message || "Could not resend the verification code.";
        } finally {
            resendCodeButton.disabled = false;
        }
    });

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("new-username").value.trim();
        const email = document.getElementById("new-email").value.trim();
        const password = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;


        if (!username || !email || !password || !confirmPassword) {
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent = "Please fill in all fields.";
            return;
        }

        if (password !== confirmPassword) {
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent = "Passwords do not match.";
            return;
        }

        if (!window.supabaseClient) {
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent =
                "Supabase is unavailable. Check your internet connection and reload the page.";
            return;
        }

        try {
            verificationEmail = await window.signupVerification.begin(
                email,
                password,
                { username, app_role: "supplier" }
            );
            registerForm.hidden = true;
            verificationForm.hidden = false;
            registerMessage.style.color = "";
            registerMessage.textContent =
                "Enter the 6-digit code sent to your email address. Check your spam folder if needed.";
        } catch (error) {
            console.error("Supabase signup failed:", error);
            registerMessage.style.color = "#fecdd3";
            registerMessage.textContent = error.message ||
                "Could not create the account. Check your connection and try again.";
        }
    });
});
