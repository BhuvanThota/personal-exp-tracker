"use client";

import { FormField } from "./FormField";
import { ActionButtons } from "./ActionButtons";

/**
 * @param {{
 *   form: any,
 *   isEditing: boolean,
 *   onChange: Function,
 *   onCancel: Function,
 *   onSave: Function,
 *   saving: boolean,
 *   usernameError: string,
 *   onUsernameBlur: Function,
 *   profilePicOptions?: string[],
 *   checkingUsername?: boolean,
 *   onEditClick?: Function
 * }} props
 */
export function ProfileForm({ form, isEditing, onChange, onCancel, onSave, saving, usernameError, onUsernameBlur, profilePicOptions = [], checkingUsername, onEditClick }) {
  const fieldLabels = {
    username: "Username",
    displayName: "Display Name",
    phone: "Phone Number",
    dob: "Date of Birth",
    address: "Address",
    city: "City",
    state: "State/Province",
    country: "Country",
    profilePic: "Profile Picture URL"
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl md:rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-4 md:p-8">
      {/* Edit Profile Button (visible only when not editing) */}
      {!isEditing && onEditClick && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onEditClick}
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 md:px-6 py-2 md:py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm md:text-base"
          >
            <span className="relative z-10 flex items-center space-x-1 md:space-x-2">
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="hidden sm:inline">Edit Profile</span>
              <span className="sm:hidden">Edit</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
        </div>
      )}
      <div className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {/* Username field with uniqueness validation */}
          <FormField
            key="username"
            name="username"
            value={form.username}
            onChange={onChange}
            isEditing={isEditing}
            label={fieldLabels.username}
            index={0}
            usernameError={typeof usernameError !== 'undefined' ? usernameError : undefined}
            onUsernameBlur={onUsernameBlur}
            checkingUsername={checkingUsername}
          />

          {/* Other fields except profilePic and username */}
          {Object.keys(form).filter(key => key !== 'username' && key !== 'profilePic').map((key, index) => (
            <FormField
              key={key}
              name={key}
              value={form[key]}
              onChange={onChange}
              isEditing={isEditing}
              label={fieldLabels[key]}
              index={index+1}
            />
          ))}

          {/* Profile Pic Selection Grid */}
          <div className="sm:col-span-2 mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Picture
            </label>
            <div className="flex flex-wrap gap-3">
              {profilePicOptions.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  className={`w-16 h-16 rounded-full border-4 ${form.profilePic === img ? 'border-blue-500' : 'border-transparent'} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                  onClick={() => isEditing && onChange({ target: { name: 'profilePic', value: img } })}
                  disabled={!isEditing}
                >
                  <img src={img} alt={`Profile ${idx+1}`} className="w-full h-full rounded-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {isEditing && (
          <ActionButtons
            onCancel={onCancel}
            onSave={onSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}
