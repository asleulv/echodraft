import { ReactNode, useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, UserRound } from "lucide-react";
import WandPencilIcon from "@/components/icons/WandPencilIcon";
import InactivityWarning from "@/components/InactivityWarning";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = "echodraft" }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNewDocMenuOpen, setIsNewDocMenuOpen] = useState(false);
  const [isMobileNewDocMenuOpen, setIsMobileNewDocMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const newDocMenuRef = useRef<HTMLDivElement>(null);
  const mobileNewDocMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Close new document menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isNewDocMenuOpen &&
        newDocMenuRef.current &&
        !newDocMenuRef.current.contains(event.target as Node)
      ) {
        setIsNewDocMenuOpen(false);
      }
    };

    if (isNewDocMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNewDocMenuOpen]);

  // Close menus when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNewDocMenuOpen(false);
    setIsMobileNewDocMenuOpen(false);
  }, [router.pathname]);

  // Close mobile new doc menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobileNewDocMenuOpen &&
        mobileNewDocMenuRef.current &&
        !mobileNewDocMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileNewDocMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileNewDocMenuOpen]);

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      current: router.pathname === "/dashboard",
    },

    {
      name: "Documents",
      href: "/documents",
      current:
        router.pathname.startsWith("/documents") &&
        router.pathname !== "/documents/trash" &&
        router.pathname !== "/pdf-exports",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      name: "Categories",
      href: "/categories",
      current: router.pathname.startsWith("/categories"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      name: "Exports",
      href: "/exports",
      current: router.pathname === "/pdf-exports",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      name: "Trash",
      href: "/documents/trash",
      current: router.pathname === "/documents/trash",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
    // Tags page is not implemented yet
    // { name: 'Tags', href: '/tags', current: router.pathname.startsWith('/tags') },
  ];

  const userNavigation = [
    { name: "Your Profile", href: "/profile" },
    { name: "Subscription", href: "/subscription" },
    { name: "Settings", href: "/settings" },
    { name: "Sign out", href: "#", onClick: () => logout() },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-primary-100 flex flex-col">
      <Head>
        <title>{`${title} | echodraft`}</title>
        <meta
          name="description"
          content="echodraft turns your best posts into reusable, on-brand content using AI — so you never start from scratch again."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <meta name="language" content="English" />
        <meta name="robots" content="index, follow" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://echodraft.app" />
        
        {/* Favicons */}
        <link rel="icon" href="/images/favicons/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/favicons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/images/favicons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/images/favicons/favicon-16x16.png" />
        <link rel="manifest" href="/images/favicons/site.webmanifest" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://echodraft.app" />
        <meta property="og:title" content={`${title} | echodraft`} />
        <meta
          property="og:description"
          content="echodraft turns your best posts into reusable, on-brand content using AI — so you never start from scratch again."
        />
        <meta
          property="og:image"
          content="https://echodraft.app/images/OGimage.png"
        />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://echodraft.app" />
        <meta property="twitter:title" content={`${title} | echodraft`} />
        <meta
          property="twitter:description"
          content="echodraft turns your best posts into reusable, on-brand content using AI — so you never start from scratch again."
        />
        <meta
          property="twitter:image"
          content="https://echodraft.app/images/OGimage.png"
        />
      </Head>

      <nav className="bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Link
                  href={isAuthenticated ? "/dashboard" : "/"}
                  className="main-logo flex items-center text-primary-600 bg-clip-text text-2xl sm:text-2xl text-xl"
                >
                  {mounted && (
                    <WandPencilIcon className="w-8 h-8 mr-1 text-primary-500 dark:text-primary-600 align-middle mr-1" />
                  )}
                  <span className="sm:text-2xl text-lg leading-tight">
                    echodraft
                  </span>
                </Link>
              </div>
              <div className="hidden lg:block">
                <div className="ml-10 flex justify-center items-baseline space-x-4">
                  {isAuthenticated &&
                    navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          item.current
                            ? "bg-primary-600 text-primary-50"
                            : "text-primary-600 border-2 border-transparent hover:border-primary-400 hover:text-primary-800"
                        } px-3 py-2 bg-primary-200 rounded-md text-sm font-medium transition-all`}
                        aria-current={item.current ? "page" : undefined}
                      >
                        {item.name}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="ml-4 flex items-center md:ml-6">
                {/* Theme toggle button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-200  flex items-center justify-center text-primary-600 dark:text-primary-600 mr-3 hover:border hover:border-primary-400"
                  aria-label="Toggle dark mode"
                >
                  {mounted &&
                    (theme === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    ))}
                </button>

                {isAuthenticated ? (
                  <div className="relative">
                    <div>
                      <button
                        type="button"
                        className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-200 flex items-center justify-center 
                                text-primary-600 dark:text-primary-600 hover:border hover:border-primary-400"
                        id="user-menu-button"
                        aria-expanded="false"
                        aria-haspopup="true"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        ref={buttonRef}
                      >
                        <span className="sr-only">Open user menu</span>
                        <UserRound size={24} />
                      </button>
                    </div>
                    {isUserMenuOpen && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-primary-100 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                        tabIndex={-1}
                        ref={menuRef}
                      >
                        {userNavigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className="block px-4 py-2 text-sm text-primary-700 dark:text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-200"
                            role="menuitem"
                            tabIndex={-1}
                            onClick={item.onClick}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex space-x-4">
                    <Link
                      href="/login"
                      className="text-primary-600 hover:bg-primary-700 dark:hover:bg-secondary-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="bg-primary-600 dark:bg-secondary-300 text-white hover:bg-primary-700 dark:hover:bg-secondary-400 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Register
                    </Link>
                  </div>
                )}

                {/* New document button - Desktop */}
                {isAuthenticated && (
                  <div className="relative">
                    <button
                      onClick={() => setIsNewDocMenuOpen(!isNewDocMenuOpen)}
                      className="rounded-full relative transition-transform duration-300 hover:rotate-90 ml-3 focus:outline-none bg-primary-100 dark:bg-primary-200 hover:bg-primary-50 hover:dark:bg-primary-300 text-primary-200 border border-primary-400"
                      aria-label="Create new document"
                    >
                      <div className="flex items-center justify-center w-12 h-12 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-secondary-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                    </button>

                    {isNewDocMenuOpen && (
                      <div
                        className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-primary-100  ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                        role="menu"
                        aria-orientation="vertical"
                        tabIndex={-1}
                        ref={newDocMenuRef}
                      >
                        <div className="py-1" role="none">
                          <button
                            onClick={() => {
                              setIsNewDocMenuOpen(false);
                              router.replace("/documents/new");
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-200"
                            role="menuitem"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Create New Document
                          </button>

                          <button
                            onClick={() => {
                              setIsNewDocMenuOpen(false);
                              router.replace("/documents/generate");
                            }}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-200"
                            role="menuitem"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            Generate with AI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="-mr-2 flex items-center lg:hidden">
              {/* Mobile theme toggle button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-200 flex items-center justify-center text-primary-800 dark:text-primary-600 mr-2 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-primary-800 focus:ring-primary-600"
                aria-label="Toggle dark mode"
              >
                {mounted &&
                  (theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  ))}
              </button>

              {/* New document button - Mobile */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsMobileNewDocMenuOpen(!isMobileNewDocMenuOpen);
                      // Close the mobile menu if it's open
                      if (isMobileMenuOpen) {
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className="rounded-full relative transition-transform duration-300 hover:rotate-90 mr-3 focus:outline-none bg-primary-100 dark:bg-primary-200 hover:bg-primary-50 hover:dark:bg-primary-300 text-primary-200 border border-primary-400"
                    aria-label="Create new document"
                  >
                    <div className="flex items-center justify-center w-10 h-10 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-secondary-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  </button>

                  {isMobileNewDocMenuOpen && (
                    <>
                      {/* Backdrop overlay */}
                      <div
                        className="fixed inset-0 bg-black bg-opacity-25 z-40 lg:hidden"
                        onClick={() => setIsMobileNewDocMenuOpen(false)}
                      ></div>

                      {/* Bottom sheet menu for mobile, dropdown for desktop */}
                      <div
                        className="fixed inset-x-0 bottom-0 md:absolute md:bottom-auto md:inset-x-auto md:top-full md:right-0 md:w-56 bg-white dark:bg-primary-100 shadow-lg rounded-t-lg md:rounded-t-none md:rounded-md z-50 transform transition-transform duration-200 ease-out"
                        role="menu"
                        aria-orientation="vertical"
                        tabIndex={-1}
                        ref={mobileNewDocMenuRef}
                      >
                        {/* Optional handle for bottom sheet */}
                        <div className="h-1.5 w-16 bg-primary-300 rounded-full mx-auto my-2 lg:hidden"></div>

                        <div className="py-2" role="none">
                          <button
                            onClick={() => {
                              setIsMobileNewDocMenuOpen(false);
                              setIsMobileMenuOpen(false);
                              router.replace("/documents/new");
                            }}
                            className="flex items-center w-full text-left px-4 py-3 text-base font-medium text-primary-600 dark:text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-200"
                            role="menuitem"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Create New Document
                          </button>

                          <button
                            onClick={() => {
                              setIsMobileNewDocMenuOpen(false);
                              setIsMobileMenuOpen(false);
                              router.replace("/documents/generate");
                            }}
                            className="flex items-center w-full text-left px-4 py-3 text-base font-medium text-primary-600 dark:text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-200"
                            role="menuitem"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            Generate with AI
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                className="bg-primary-100 dark:bg-primary-200 inline-flex items-center justify-center p-2 rounded-md text-primary-600 dark:text-primary-600 hover:bg-primary-200 dark:hover:bg-primary-300 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-offset-primary-800 focus:ring-primary-600"
                aria-controls="mobile-menu"
                aria-expanded="false"
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  // Close the new doc menu if it's open
                  if (isMobileNewDocMenuOpen) {
                    setIsMobileNewDocMenuOpen(false);
                  }
                }}
              >
                <span className="sr-only">Open main menu</span>
                {!isMobileMenuOpen ? (
                  <svg
                    className="block h-6 w-6 text-primary-600 dark:text-primary-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                ) : (
                  <svg
                    className="block h-6 w-6 text-primary-600 dark:text-primary-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div
            className="lg:hidden bg-white dark:bg-primary-100"
            id="mobile-menu"
          >
            <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3 border-b border-primary-300">
              {isAuthenticated &&
                navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      item.current
                        ? "bg-primary-500 text-primary-200"
                        : "text-primary-600 dark:text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-200"
                    } block px-4 py-3 rounded-md text-base font-medium flex items-center`}
                    aria-current={item.current ? "page" : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
            </div>
            <div className="pt-4 pb-3 border-t border-primary-200 dark:border-primary-700 border-b border-primary-300">
              {isAuthenticated ? (
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <span className="h-10 w-10 rounded-full bg-primary-400 flex items-center justify-center text-primary-800 dark:text-primary-600 text-lg">
                      <UserRound size={24} />
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium leading-none text-primary-700 dark:text-primary-500">
                      {user?.first_name
                        ? `${user.first_name} ${user.last_name || ""}`
                        : user?.username}
                    </div>
                    <div className="text-sm font-medium leading-none text-primary-400 dark:text-primary-400">
                      {user?.email}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-4 px-5 justify-center">
                  <Link
                    href="/login"
                    className="bg-secondary-400 text-black hover:bg-primary-700 dark:hover:bg-secondary-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-secondary-400 text-black hover:bg-primary-700 dark:hover:bg-secondary-400 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Register
                  </Link>
                </div>
              )}
              {isAuthenticated && (
                <div className="mt-3 px-2 space-y-1">
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 dark:text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-200"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        if (item.onClick) {
                          item.onClick();
                        }
                      }}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">{children}</main>

      {/* Inactivity Warning */}
      <InactivityWarning />

      <footer className="bg-primary-50 border-t border-primary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-500 text-center sm:text-left">
              &copy; {new Date().getFullYear()} echodraft. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
