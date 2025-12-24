// Authentication Handling Script

document.addEventListener('DOMContentLoaded', async function () {
    // Check if we're on the login page
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            
            try {
                // Sign in with Supabase Auth
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                
                if (error) throw error;
                
                // Redirect based on user role
                if (data.user.email === 'shenli8103@163.com') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.classList.remove('hidden');
            }
        });
    }
    
    // Check if we're on the register page
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', async function (e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');
            
            try {
                // Sign up with Supabase Auth, disabling email confirmation
                const { data, error } = await supabaseClient.auth.signUp({
                    email: email,
                    password: password
                }, {
                    emailRedirectTo: window.location.origin
                });
                
                if (error) throw error;
                
                // Check if email confirmation is required
                if (data.user.identities && data.user.identities.length > 0) {
                    // User created and logged in automatically (no email confirmation required)
                    successMessage.textContent = 'Registration successful! Redirecting to dashboard...';
                    successMessage.classList.remove('hidden');
                    errorMessage.classList.add('hidden');
                    
                    // Redirect based on user role
                    setTimeout(() => {
                        if (email === 'shenli8103@163.com') {
                            window.location.href = 'admin.html';
                        } else {
                            window.location.href = 'index.html';
                        }
                    }, 2000);
                } else {
                    // Email confirmation required
                    successMessage.textContent = 'Registration successful! Please check your email to confirm your account.';
                    successMessage.classList.remove('hidden');
                    errorMessage.classList.add('hidden');
                }
                
                // Reset form
                document.getElementById('registerForm').reset();
            } catch (error) {
                errorMessage.textContent = error.message;
                errorMessage.classList.remove('hidden');
                successMessage.classList.add('hidden');
            }
        });
    }
});