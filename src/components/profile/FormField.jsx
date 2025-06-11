"use client";

export function FormField({ name, value, onChange, isEditing, label, index, usernameError, onUsernameBlur, checkingUsername }) {
  const getInputType = (fieldName) => {
    if (fieldName === "dob") return "date";
    if (fieldName === "profilePic") return "url";
    return "text";
  };

  const isWideField = name === 'address' || name === 'profilePic';

  return (
    <div 
      className={`group transform hover:scale-105 transition-all duration-200 ${
        isWideField ? 'sm:col-span-2' : ''
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
        {label}
      </label>
      <div className="relative">
        {name === "profilePic" ? null : (
          <input
            type={getInputType(name)}
            name={name}
            value={value}
            onChange={onChange}
            disabled={!isEditing}
            className={`w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl border-2 transition-all duration-300 focus:outline-none text-sm md:text-base ${
              isEditing
                ? "border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700"
                : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
            } text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 group-hover:shadow-md transform group-hover:scale-[1.01]`}
            placeholder={`Enter your ${label.toLowerCase()}`}
            {...(name === 'username' ? { onBlur: onUsernameBlur } : {})}
          />
        )}
        {/* Username error message */}
        {name === 'username' && checkingUsername && (
          <div className="text-xs text-blue-500 mt-1 flex items-center gap-1"><span className="loader w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>Checking...</div>
        )}
        {name === 'username' && usernameError && (
          <div className="text-xs text-red-600 mt-1">{usernameError}</div>
        )}
        {isEditing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
