document.addEventListener("DOMContentLoaded", function () {
    const loginModal = document.getElementById("login-modal");
    const openLoginButton = document.getElementById("open-login");
    const closeLoginButton = document.getElementById("close-login");
    const registerModal = document.getElementById("register-modal");
    const openRegisterButton = document.getElementById("open-register");
    const closeRegisterButton = document.getElementById("close-register");
    const switchToLoginButton = document.getElementById("switch-to-login");

    function openLogin() {
        registerModal.hidden = true;
        loginModal.hidden = false;
        document.body.classList.add("modal-open");
        document.getElementById("username").focus();
    }

    function closeLogin() {
        loginModal.hidden = true;
        document.body.classList.toggle(
            "modal-open",
            !registerModal.hidden
        );
        openLoginButton.focus();
    }

    function openRegister() {
        loginModal.hidden = true;
        registerModal.hidden = false;
        document.body.classList.add("modal-open");
        document.getElementById("new-username").focus();
    }

    function closeRegister() {
        registerModal.hidden = true;
        document.body.classList.toggle("modal-open", !loginModal.hidden);
        openRegisterButton.focus();
    }

    openLoginButton.addEventListener("click", openLogin);
    closeLoginButton.addEventListener("click", closeLogin);
    openRegisterButton.addEventListener("click", openRegister);
    closeRegisterButton.addEventListener("click", closeRegister);
    switchToLoginButton.addEventListener("click", openLogin);
    loginModal.addEventListener("click", function (event) {
        if (event.target === loginModal) {
            closeLogin();
        }
    });
    registerModal.addEventListener("click", function (event) {
        if (event.target === registerModal) {
            closeRegister();
        }
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            if (!loginModal.hidden) {
                closeLogin();
            } else if (!registerModal.hidden) {
                closeRegister();
            }
        }
    });

    const loginForm = document.getElementById("login-form");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const rememberCheckbox = document.getElementById("remember");
    const loginMessage = document.getElementById("login-message");
    const resendConfirmationButton = document.getElementById(
        "resend-confirmation-button"
    );
    const verificationSection = document.getElementById("login-verification");
    const verifyEmailButton = document.getElementById("verify-email-button");

    async function redirectIfAlreadySignedIn() {
        const { data: sessionData, error: sessionError } =
            await window.supabaseClient.auth.getSession();

        if (sessionError) {
            console.error("Could not check the existing sign-in session:", sessionError);
            loginMessage.textContent =
                "Could not check your sign-in status. Please reload the page and try again.";
            loginMessage.style.color = "#fecdd3";
            return;
        }

        const session = sessionData.session;
        if (!session) {
            return;
        }

        const { data: roleData, error: roleError } = await window.supabaseClient
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (roleError) {
            console.error("Could not load the signed-in account role:", roleError);
            loginMessage.textContent =
                "You are signed in, but your account role could not be checked. Please try again.";
            loginMessage.style.color = "#fecdd3";
            return;
        }

        const rolePages = {
            admin: "index.html",
            driver: "driver-dashboard.html",
            supplier: "supplier-dashboard.html"
        };
        const destination = rolePages[roleData?.role];

        if (!destination) {
            console.error("The signed-in account has no valid application role.");
            loginMessage.textContent =
                "Your account has no valid role. Contact your administrator.";
            loginMessage.style.color = "#fecdd3";
            const { error: signOutError } =
                await window.supabaseClient.auth.signOut();
            if (signOutError) {
                console.error("Could not sign out the account with no valid role:", signOutError);
            }
            return;
        }

        sessionStorage.setItem("isLoggedIn", "true");
        window.location.replace(destination);
    }

    if (window.supabaseClient) {
        redirectIfAlreadySignedIn();
    }

    const savedUsername = localStorage.getItem("rememberUsername");

    if (savedUsername && usernameInput && rememberCheckbox) {
        usernameInput.value = savedUsername;
        rememberCheckbox.checked = true;
    }

    if (loginForm) {
        if (resendConfirmationButton) {
            resendConfirmationButton.addEventListener("click", async function () {
                const email = usernameInput.value.trim();

                if (!email || !email.includes("@")) {
                    loginMessage.textContent =
                        "Enter the email address you used to sign up.";
                    loginMessage.style.color = "#fecdd3";
                    return;
                }

                resendConfirmationButton.disabled = true;
                loginMessage.textContent = "Sending confirmation email...";
                loginMessage.style.color = "";

                try {
                    const { error } = await window.supabaseClient.auth.resend({
                        type: "signup",
                        email,
                        options: {
                            emailRedirectTo: `${window.location.origin}/login.html`
                        }
                    });

                    if (error) {
                        throw error;
                    }

                    loginMessage.textContent =
                        "If the account can receive a verification code, Supabase has sent one. Check your inbox and spam folder.";
                    loginMessage.style.color = "#a7f3d0";
                    verificationSection.hidden = false;
                } catch (error) {
                    console.error("Could not resend confirmation email:", error);
                    loginMessage.textContent =
                        error.message || "Could not resend the confirmation email.";
                    loginMessage.style.color = "#fecdd3";
                } finally {
                    resendConfirmationButton.disabled = false;
                }
            });
        }

        if (verifyEmailButton) {
            verifyEmailButton.addEventListener("click", async function () {
                const email = usernameInput.value.trim();
                const token = document.getElementById(
                    "login-verification-code"
                ).value.trim();

                if (!email || !email.includes("@")) {
                    loginMessage.textContent =
                        "Enter the email address used to create the account.";
                    loginMessage.style.color = "#fecdd3";
                    return;
                }

                if (!/^\d{6}$/.test(token)) {
                    loginMessage.textContent =
                        "Enter the 6-digit verification code from your email.";
                    loginMessage.style.color = "#fecdd3";
                    return;
                }

                verifyEmailButton.disabled = true;
                loginMessage.textContent = "Verifying your email...";
                loginMessage.style.color = "";

                try {
                    await window.signupVerification.verify(email, token);
                    verificationSection.hidden = true;
                    loginMessage.textContent =
                        "Email verified. Sign in with your email and password.";
                    loginMessage.style.color = "#a7f3d0";
                } catch (error) {
                    console.error("Could not verify signup email:", error);
                    loginMessage.textContent =
                        error.message || "Could not verify the email code.";
                    loginMessage.style.color = "#fecdd3";
                } finally {
                    verifyEmailButton.disabled = false;
                }
            });
        }

        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (resendConfirmationButton) {
                resendConfirmationButton.hidden = true;
            }
            if (verificationSection) {
                verificationSection.hidden = true;
            }

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            if (!window.supabaseClient) {
                loginMessage.textContent =
                    "Supabase is unavailable. Check your internet connection and reload the page.";
                loginMessage.style.color = "#fecdd3";
                return;
            }

            try {
                const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                    email: username,
                    password
                });

                if (!error) {
                    const { data: roleData, error: roleError } =
                        await window.supabaseClient
                            .from("user_roles")
                            .select("role")
                            .eq("user_id", data.user.id)
                            .maybeSingle();

                    if (roleError || !roleData) {
                        console.error("Could not load account role:", roleError);
                        await window.supabaseClient.auth.signOut();
                        loginMessage.textContent =
                            "No role was found for this account. Run the complete Supabase setup SQL in the app's configured project, then sign in again.";
                        loginMessage.style.color = "#fecdd3";
                        return;
                    }

                    sessionStorage.setItem("isLoggedIn", "true");

                    if (rememberCheckbox.checked) {
                        localStorage.setItem("rememberUsername", username);
                    } else {
                        localStorage.removeItem("rememberUsername");
                    }

                    const rolePages = {
                        admin: "index.html",
                        driver: "driver-dashboard.html",
                        supplier: "supplier-dashboard.html"
                    };
                    window.location.href = rolePages[roleData.role] || "login.html";
                    return;
                }

                loginMessage.textContent = error.message;
                loginMessage.style.color = "#fecdd3";
                if (
                    resendConfirmationButton &&
                    (error.code === "email_not_confirmed" ||
                        error.message.toLowerCase().includes("email not confirmed"))
                ) {
                    resendConfirmationButton.hidden = false;
                }
            } catch (error) {
                console.error("Supabase sign-in failed:", error);
                loginMessage.textContent =
                    "Could not connect to Supabase. Check your internet connection and try again.";
                loginMessage.style.color = "#fecdd3";
            }
        });
    }
});
