import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { RegistrationData } from "@/types/api";
import WandPencilIcon from "@/components/icons/WandPencilIcon";
import { useSystemMessage } from "@/hooks/useSystemMessage";
import SystemMessage from "@/components/SystemMessage";

export default function Register() {
  // Fetch system message for register page
  const { message: systemMessage, dismissMessage } = useSystemMessage('register');
  
  // Using a separate state for organization name to avoid type issues
  const [organizationName, setOrganizationName] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    first_name: "",
    last_name: "",
    role: "admin" as const, // Default role for new users
    marketing_consent: false,
  });
  const [error, setError] = useState<string | Record<string, any>>("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "organization") {
      setOrganizationName(value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate passwords match client-side
    if (formData.password !== formData.password_confirm) {
      setError({ password_confirm: ["Passwords don't match"] });
      setIsLoading(false);
      return;
    }

    try {
      // Create a simple registration object with only the required fields
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        organization: organizationName, // Pass organization name directly as a string
        role: formData.role,
        first_name: formData.first_name,
        last_name: formData.last_name,
        marketing_consent: formData.marketing_consent,
      };

      // Log the data for debugging
      console.log("Submitting registration data:", registrationData);

      await register(registrationData);
      
      // Show success message instead of redirecting
      setSuccess("Registration successful! Please check your email to verify your account before logging in.");
      
      // Clear the form
      setFormData({
        username: "",
        email: "",
        password: "",
        password_confirm: "",
        first_name: "",
        last_name: "",
        role: "admin",
        marketing_consent: false,
      });
      setOrganizationName("");
    } catch (err: any) {
      console.error("Registration error:", err.response?.data || err.message);

      // Log the full error for debugging
      console.error("Full error object:", err);

      if (err.response?.data) {
        setError(err.response.data);
      } else if (err.response?.status === 500) {
        setError(
          "Server error occurred. Please try again later or contact support."
        );
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to display field errors
  const getFieldError = (field: string) => {
    if (typeof error === "object" && error !== null) {
      // Special case for organization field
      if (field === "organization") {
        // Check for organization.name errors
        const orgError = error.organization;
        if (typeof orgError === "object" && orgError !== null) {
          return orgError.name?.[0] || "";
        }
        // Check for direct organization errors
        return Array.isArray(orgError) ? orgError[0] : "";
      }

      // Handle nested errors (e.g., organization.name)
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        const parentError = error[parent];
        if (typeof parentError === "object" && parentError !== null) {
          return parentError[child]?.[0] || "";
        }
        return error[`${parent}.${child}`]?.[0] || "";
      }

      // Handle regular field errors
      const fieldError = error[field];
      return Array.isArray(fieldError) ? fieldError[0] : "";
    }
    return "";
  };

  return (
    <Layout title="Register">
      <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold bg-gradient-to-r from-secondary-400 to-secondary-800 bg-clip-text text-transparent dark:from-secondary-700 dark:to-secondary-500">
            <WandPencilIcon className="w-24 h-24 mx-auto text-secondary-800 dark:text-secondary-500" />
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900 dark:text-white">
            Create a new account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{" "}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-primary-100 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* System Message */}
            {systemMessage && (
              <div className="mb-6">
                <SystemMessage 
                  message={systemMessage} 
                  onClose={dismissMessage}
                />
              </div>
            )}
            
            {/* Display success message or disable registration if needed */}
            {success ? (
              <div className="text-center">
                <div className="mb-4 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded">
                  {success}
                </div>
                <Link
                  href="/login"
                  className="mt-4 inline-block px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Go to Login
                </Link>
              </div>
            ) : systemMessage && systemMessage.disable_functionality ? (
              <div className="text-center">
                <div className="mb-4 px-4 py-3 rounded">
                  <p className="text-primary-700 dark:text-primary-300 mt-4">
                    Registration is currently disabled. Please check back later.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Display general errors */}
                {typeof error === "string" && error && (
                  <div className="mb-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {/* Display non-field errors from the backend */}
                {typeof error === "object" &&
                  error !== null &&
                  error.non_field_errors && (
                    <div className="mb-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
                      {Array.isArray(error.non_field_errors)
                        ? error.non_field_errors.join(", ")
                        : error.non_field_errors}
                    </div>
                  )}

                {/* Display detail errors from the backend */}
                {typeof error === "object" && error !== null && error.detail && (
                  <div className="mb-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
                    {error.detail}
                  </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="username" className="form-label">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      className={`form-input ${
                        getFieldError("username")
                          ? "border-danger-300 dark:border-danger-700"
                          : ""
                      }`}
                      value={formData.username}
                      onChange={handleChange}
                    />
                    {getFieldError("username") && (
                      <p className="form-error">{getFieldError("username")}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="first_name" className="form-label">
                        First Name
                      </label>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        autoComplete="given-name"
                        className={`form-input ${
                          getFieldError("first_name")
                            ? "border-danger-300 dark:border-danger-700"
                            : ""
                        }`}
                        value={formData.first_name}
                        onChange={handleChange}
                      />
                      {getFieldError("first_name") && (
                        <p className="form-error">{getFieldError("first_name")}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="last_name" className="form-label">
                        Last Name
                      </label>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        autoComplete="family-name"
                        className={`form-input ${
                          getFieldError("last_name")
                            ? "border-danger-300 dark:border-danger-700"
                            : ""
                        }`}
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                      {getFieldError("last_name") && (
                        <p className="form-error">{getFieldError("last_name")}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`form-input ${
                        getFieldError("email")
                          ? "border-danger-300 dark:border-danger-700"
                          : ""
                      }`}
                      value={formData.email}
                      onChange={handleChange}
                    />
                    {getFieldError("email") && (
                      <p className="form-error">{getFieldError("email")}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="organization" className="form-label">
                      Organization Name (Optional)
                    </label>
                    <input
                      id="organization"
                      name="organization"
                      type="text"
                      className={`form-input ${
                        getFieldError("organization")
                          ? "border-danger-300 dark:border-danger-700"
                          : ""
                      }`}
                      value={organizationName}
                      onChange={handleChange}
                      placeholder="Leave blank to use your email address"
                    />
                    {getFieldError("organization") && (
                      <p className="form-error">{getFieldError("organization")}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      If left blank, your email address will be used as your
                      organization name.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={`form-input ${
                        getFieldError("password")
                          ? "border-danger-300 dark:border-danger-700"
                          : ""
                      }`}
                      value={formData.password}
                      onChange={handleChange}
                    />
                    {getFieldError("password") && (
                      <p className="form-error">{getFieldError("password")}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password_confirm" className="form-label">
                      Confirm Password
                    </label>
                    <input
                      id="password_confirm"
                      name="password_confirm"
                      type="password"
                      autoComplete="new-password"
                      required
                      className={`form-input ${
                        getFieldError("password_confirm")
                          ? "border-danger-300 dark:border-danger-700"
                          : ""
                      }`}
                      value={formData.password_confirm}
                      onChange={handleChange}
                    />
                    {getFieldError("password_confirm") && (
                      <p className="form-error">
                        {getFieldError("password_confirm")}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="marketing_consent"
                        name="marketing_consent"
                        type="checkbox"
                        checked={formData.marketing_consent}
                        onChange={(e) => 
                          setFormData((prev) => ({ 
                            ...prev, 
                            marketing_consent: e.target.checked 
                          }))
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="marketing_consent" className="font-medium text-gray-700 dark:text-gray-300">
                        Marketing emails
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Yes, I'd like to receive updates about new features, tips, and special offers. You can unsubscribe at any time.
                      </p>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="btn-primary w-full flex justify-center"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create account"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
