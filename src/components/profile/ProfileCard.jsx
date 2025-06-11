"use client";

export function ProfileCard({ form, session }) {
  const calculateCompletionPercentage = () => {
    return Math.round((Object.values(form).filter(v => v && v.length > 0).length / Object.keys(form).length) * 100);
  };

  const calculateAge = () => {
    if (!form.dob) return "--";
    return new Date().getFullYear() - new Date(form.dob).getFullYear();
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 md:p-6 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
      <div className="text-center">
        <div className="relative inline-block group">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-1 animate-pulse-slow">
            <img
              src={form.profilePic || session?.user?.image || "https://placehold.co/128x128"}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800 transform group-hover:scale-110 transition-transform duration-300"
              onError={(e) => {
                e.target.src = "https://placehold.co/128x128";
              }}
            />
          </div>
          <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-full border-3 md:border-4 border-white dark:border-gray-800 animate-bounce"></div>
        </div>
        
        <h2 className="mt-3 md:mt-4 text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          {form.displayName || session?.user?.name || "User"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 md:mb-2">
          @{form.username || "username"}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate px-2">
          {session?.user?.email}
        </p>
        
        {/* Stats */}
        <div className="mt-4 md:mt-6 grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-2 md:p-3 transform hover:scale-105 transition-transform duration-200">
            <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white animate-count-up">
              {calculateCompletionPercentage()}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Complete</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-2 md:p-3 transform hover:scale-105 transition-transform duration-200">
            <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
              {calculateAge()}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Years Old</div>
          </div>
        </div>
      </div>
    </div>
  );
}
