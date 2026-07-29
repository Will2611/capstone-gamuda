import { useState, useEffect } from "react";
import type { SubmitEvent as ReactSubmitEvent } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Clock,
  Camera,
  Phone,
  Link as LinkIcon,
  Image as ImageIcon,
  Utensils,
  DollarSign,
  Coffee,
  Leaf,
  Upload,
  X,
} from "lucide-react";

import { FormField, SelectField } from "./FormField";
import { MultiSelectField } from "./MultiSelectField";
import { Button } from "./Button";
import {
  CUISINE_OPTIONS,
  PRICE_OPTIONS,
  AMBIENCE_OPTIONS,
  DIETARY_OPTIONS,
} from "./config/FilterOption";
import { bitescoutApi } from "../services/baseApi";

export function SignUpFormOwner() {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [restaurantImages, setRestaurantImages] = useState<string[]>([]);
  const [restaurantURL, setRestaurantURL] = useState("");
  const [cuisineType, setCuisineType] = useState<string[]>([]);
  const [ambience, setAmbience] = useState<string[]>([]);
  const [dietaryNeeds, setDietaryNeeds] = useState<string[]>([]);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [closedDays, setClosedDays] = useState<string[]>([]);
  const [street, setStreet] = useState("");
  const [postcode, setPostcode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [consent, setConsent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const fetchCoordinatesFromAddress = async () => {
    if (!street.trim() || !postcode.trim() || !city.trim()) return;

    setIsSearchingLocation(true);
    try {
      let cleanStreet1 = street
        .replace(/no\.?\s*\d+[-–\/]*\d*\w*/gi, "")
        .replace(/lot\.?\s*\d+/gi, "")
        .replace(/block\s*\w+/gi, "")
        .replace(/flat\s*\w+/gi, "")
        .replace(/level\s*\d+/gi, "")
        .replace(/floor\s*\d+/gi, "")
        .replace(/[\s,]+/g, " ")
        .trim();

      if (!cleanStreet1) cleanStreet1 = street.trim();

      let address_params = {
        street: cleanStreet1,
        postalcode: postcode.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || "Malaysia",
      };
      let params = new URLSearchParams({
        format: "json",
        limit: "1",
        ...address_params,
      });

      // let response = await fetch(
      //   `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      // );
      // let data = await response.json();
      const { data }: { data: { lat: string; lon: string }[] } =
        await axios.get(`https://nominatim.openstreetmap.org/search`, {
          params,
        });

      if (data && data.length > 0) {
        setLatitude(parseFloat(data[0].lat));
        setLongitude(parseFloat(data[0].lon));
        return;
      }

      setLatitude(null);
      setLongitude(null);
    } catch (error) {
      console.error("Geocoding Error:", error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCoordinatesFromAddress();
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [street, postcode, city, state, country]);

  const getValidationErrors = (values: Record<string, any>) => {
    const next: Record<string, string> = {};

    if (!values.ownerName?.trim()) next.ownerName = "Owner name is required";

    if (!values.email?.trim()) {
      next.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = "Enter a valid email address";
    }

    if (!values.password) {
      next.password = "Password is required";
    } else if (values.password.length < 8) {
      next.password = "Password must be at least 8 characters";
    }

    if (!values.restaurantName?.trim())
      next.restaurantName = "Restaurant name is required";

    if (values.restaurantURL?.trim()) {
      try {
        const parsedUrl = new URL(values.restaurantURL);
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
          next.restaurantURL = "URL must start with http:// or https://";
        }
      } catch {
        next.restaurantURL = "Enter a valid website URL";
      }
    }

    if (!values.restaurantImages || values.restaurantImages.length === 0) {
      next.restaurantImages = "At least one restaurant image must be uploaded";
    }

    if (!values.contactNo?.trim()) {
      next.contactNo = "Restaurant contact number is required";
    } else if (values.contactNo.length < 10) {
      next.contactNo = "Enter a valid contact number";
    }

    if (!values.cuisineType || values.cuisineType.length === 0)
      next.cuisineType = "Please select at least one cuisine type";
    if (!values.priceRange) next.priceRange = "Please select a price range";
    if (!values.ambience || values.ambience.length === 0)
      next.ambience = "Please select at least one restaurant ambience";

    if (!values.openTime) next.openTime = "Opening time is required";
    if (!values.closeTime) next.closeTime = "Closing time is required";

    if (!values.street?.trim()) next.street = "Street is required";
    if (!values.postcode?.trim()) next.postcode = "Postcode is required";
    if (!values.city?.trim()) next.city = "City is required";
    if (!values.state?.trim()) next.state = "State is required";
    if (!values.country?.trim()) next.country = "Country is required";
    if (!values.consent) next.consent = "You must accept the Privacy Policy";

    return next;
  };

  const runValidation = (updatedFields: Record<string, any> = {}) => {
    const currentValues = {
      ownerName,
      email,
      password,
      restaurantName,
      contactNo,
      restaurantURL,
      restaurantImages,
      cuisineType,
      priceRange,
      ambience,
      openTime,
      closeTime,
      street,
      postcode,
      city,
      state,
      country,
      consent,
      ...updatedFields,
    };
    const nextErrors = getValidationErrors(currentValues);
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleFieldChange = (
    value: any,
    setter: (val: any) => void,
    fieldName: string,
  ) => {
    setter(value);
    if (touched[fieldName]) {
      runValidation({ [fieldName]: value });
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    runValidation();
  };

  const handleSubmit = async (e: ReactSubmitEvent) => {
    e.preventDefault();

    const allTouched: Record<string, boolean> = {
      ownerName: true,
      email: true,
      password: true,
      restaurantName: true,
      contactNo: true,
      restaurantURL: true,
      restaurantImages: true,
      cuisineType: true,
      priceRange: true,
      ambience: true,
      openTime: true,
      closeTime: true,
      street: true,
      postcode: true,
      city: true,
      state: true,
      country: true,
      consent: true,
    };

    setTouched(allTouched);
    const nextErrors = runValidation();
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);

    const payload = {
      email,
      password,
      display_name: ownerName,
      role: "owner",
      profile_image: profileImage,
      restaurant: {
        name: restaurantName,
        contact_number: contactNo,
        website_url: restaurantURL,
        images: restaurantImages,
        cuisine_types: cuisineType,
        price_range: priceRange,
        ambience_vibes: ambience,
        dietary_needs: dietaryNeeds,
        open_time: openTime,
        close_time: closeTime,
        closed_days: closedDays,
        address: {
          street,
          postcode,
          city,
          state,
          country,
          latitude,
          longitude,
        },
      },
    };

    try {
      // const response = await fetch(
      //   "http://localhost:8000/user/owner/register",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify(payload),
      //   },
      // );

      // const data = await response.json();
      await bitescoutApi.post("/user/owner/register", payload);

      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (error: any) {
      console.error("API Error:", error);

      const msg =
        error.response.data.detail || error.message || "Something went wrong";
      if (msg.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: msg }));
      } else {
        setErrors((prev) => ({ ...prev, apiError: msg }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          form: "Only JPG, PNG, and WEBP image formats are allowed for the profile picture.",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          form: "Image size should be less than 5MB.",
        }));
        return;
      }

      setErrors((prev) => {
        const { form, ...rest } = prev;
        return rest;
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setProfileImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfileImage(null);
  };

  const handleRestaurantImagesUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    setTouched((t) => ({ ...t, restaurantImages: true }));

    const hasInvalidType = files.some(
      (file) => !allowedTypes.includes(file.type),
    );

    if (hasInvalidType) {
      setErrors((prev) => ({
        ...prev,
        restaurantImages: "Only JPG, PNG, and WEBP image formats are allowed",
      }));
      return;
    }

    const hasTooLargeFile = files.some((file) => file.size > 5 * 1024 * 1024);
    if (hasTooLargeFile) {
      setErrors((prev) => ({
        ...prev,
        restaurantImages: "Each image size should be less than 5MB",
      }));
      return;
    }

    if (files.length > 0) {
      const promises = files.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(promises)
        .then((base64Images) => {
          setErrors((prev) => {
            const { restaurantImages, ...rest } = prev;
            return rest;
          });
          const updated = [...restaurantImages, ...base64Images];
          setRestaurantImages(updated);
          runValidation({ restaurantImages: updated });
        })
        .catch((err) => {
          console.error("Error reading restaurant images:", err);
        });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex flex-col items-center gap-3">
        <div className="relative group/container">
          <label htmlFor="profile-upload" className="cursor-pointer group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-bs-gold bg-bs-neutral-100 flex items-center justify-center">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-bs-neutral-400" />
              )}
            </div>

            {!profileImage && (
              <div className="absolute bottom-1 right-1 bg-bs-gold text-white p-2 rounded-full shadow-md group-hover:scale-105 transition">
                <Camera size={16} />
              </div>
            )}
          </label>

          {profileImage && (
            <button
              type="button"
              onClick={handleImageRemove}
              disabled={isLoading}
              className="absolute top-0 right-0 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow-md transition transform hover:scale-110 flex items-center justify-center border-2 border-white"
              title="Remove Profile Picture"
            >
              <X size={12} className="stroke-[3]" />
            </button>
          )}

          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isLoading}
          />
        </div>
        <p className="text-sm text-bs-neutral-500">Upload Profile Picture</p>
      </div>

      {errors.apiError && (
        <div className="p-3 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-600">
          {errors.apiError}
        </div>
      )}

      <FormField
        label="Owner Name"
        type="text"
        icon={<User size={20} />}
        placeholder="Owner Name"
        value={ownerName}
        onChange={(e) =>
          handleFieldChange(e.target.value, setOwnerName, "ownerName")
        }
        onBlur={() => handleBlur("ownerName")}
        error={touched.ownerName ? errors.ownerName : undefined}
        disabled={isLoading}
      />

      <FormField
        label="Email"
        type="email"
        icon={<Mail size={20} />}
        placeholder="restaurant@example.com"
        value={email}
        onChange={(e) => handleFieldChange(e.target.value, setEmail, "email")}
        onBlur={() => handleBlur("email")}
        error={touched.email ? errors.email : undefined}
        disabled={isLoading}
      />

      <div className="relative">
        <FormField
          label="Password"
          type={showPassword ? "text" : "password"}
          icon={<Lock size={20} />}
          placeholder="••••••••"
          value={password}
          onChange={(e) =>
            handleFieldChange(e.target.value, setPassword, "password")
          }
          onBlur={() => handleBlur("password")}
          error={touched.password ? errors.password : undefined}
          className="pr-12"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 text-bs-neutral-500 hover:text-bs-neutral-700 transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <hr />

      <FormField
        label="Restaurant Name"
        type="text"
        icon={<User size={20} />}
        placeholder="Restaurant Name"
        value={restaurantName}
        onChange={(e) =>
          handleFieldChange(e.target.value, setRestaurantName, "restaurantName")
        }
        onBlur={() => handleBlur("restaurantName")}
        error={touched.restaurantName ? errors.restaurantName : undefined}
        disabled={isLoading}
      />

      <FormField
        label="Restaurant Contact Number"
        type="tel"
        icon={<Phone size={20} />}
        placeholder="Restaurant Contact Number"
        value={contactNo}
        onChange={(e) =>
          handleFieldChange(e.target.value, setContactNo, "contactNo")
        }
        onBlur={() => handleBlur("contactNo")}
        error={touched.contactNo ? errors.contactNo : undefined}
        disabled={isLoading}
      />

      <FormField
        label="Restaurant Website URL"
        type="text"
        icon={<LinkIcon size={20} />}
        placeholder="Restaurant URL"
        value={restaurantURL}
        onChange={(e) =>
          handleFieldChange(e.target.value, setRestaurantURL, "restaurantURL")
        }
        onBlur={() => handleBlur("restaurantURL")}
        error={touched.restaurantURL ? errors.restaurantURL : undefined}
        disabled={isLoading}
      />

      <div>
        <label className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-bs-neutral-800">
          <ImageIcon size={16} className="text-bs-neutral-500" />
          Restaurant Images
        </label>

        <input
          type="file"
          id="restaurant-image-upload"
          accept="image/*"
          multiple
          onChange={handleRestaurantImagesUpload}
          className="hidden"
          disabled={isLoading}
        />

        <div
          onClick={() => {
            document.getElementById("restaurant-image-upload")?.click();
          }}
          onBlur={() => handleBlur("restaurantImages")}
          tabIndex={0}
          className={`
            border-2 border-dashed rounded-2xl p-6
            flex flex-col items-center justify-center
            cursor-pointer transition-all duration-200 focus:outline-none
            ${
              touched.restaurantImages && errors.restaurantImages
                ? "border-bs-red bg-bs-red/5"
                : restaurantImages.length > 0
                  ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                  : "border-bs-neutral-300 hover:border-bs-gold bg-bs-neutral-50 hover:bg-bs-neutral-100/50"
            }
          `}
        >
          {restaurantImages.length > 0 ? (
            <div className="text-center space-y-4 w-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {restaurantImages.map((imgUrl, index) => (
                  <div
                    key={index}
                    className="relative group/thumb h-20 rounded-md overflow-hidden shadow-sm"
                  >
                    <img
                      src={imgUrl}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = restaurantImages.filter(
                          (_, i) => i !== index,
                        );
                        setRestaurantImages(updated);
                        runValidation({ restaurantImages: updated });
                      }}
                      className="absolute inset-0 bg-black/40 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {restaurantImages.length} Image(s) Loaded
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRestaurantImages([]);
                    runValidation({ restaurantImages: [] });
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="p-3 bg-white border border-bs-neutral-200 rounded-xl inline-block text-bs-neutral-500 shadow-sm">
                <Upload size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-bs-neutral-800">
                  Click to upload restaurant images
                </p>
                <p className="text-xs text-bs-neutral-400 mt-1">
                  PNG, JPG, JPEG up to 5MB (Supports selection of multiple
                  files)
                </p>
              </div>
            </div>
          )}
        </div>

        {touched.restaurantImages && errors.restaurantImages && (
          <p className="text-sm text-bs-red mt-1 animate-fadeIn">
            {errors.restaurantImages}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <MultiSelectField
            label="Cuisine Type"
            value={cuisineType}
            onChange={(val) =>
              handleFieldChange(val, setCuisineType, "cuisineType")
            }
            options={CUISINE_OPTIONS}
            disabled={isLoading}
            icon={<Utensils size={18} />}
            placeholder="Any Cuisine"
          />
          {touched.cuisineType && errors.cuisineType && (
            <p className="text-sm text-bs-red">{errors.cuisineType}</p>
          )}
        </div>

        <SelectField
          label="Price Range"
          value={priceRange}
          icon={<DollarSign size={18} />}
          onChange={(e) =>
            handleFieldChange(e.target.value, setPriceRange, "priceRange")
          }
          onBlur={() => handleBlur("priceRange")}
          options={PRICE_OPTIONS}
          disabled={isLoading}
          error={touched.priceRange ? errors.priceRange : undefined}
          placeholder="Any Price"
        />

        <div className="space-y-2">
          <MultiSelectField
            label="Vibe / Ambience"
            value={ambience}
            onChange={(val) => handleFieldChange(val, setAmbience, "ambience")}
            options={AMBIENCE_OPTIONS}
            disabled={isLoading}
            icon={<Coffee size={18} />}
            placeholder="Any Vibe"
          />
          {touched.ambience && errors.ambience && (
            <p className="text-sm text-bs-red">{errors.ambience}</p>
          )}
        </div>

        <MultiSelectField
          label="Dietary Requirements"
          value={dietaryNeeds}
          onChange={(val) => setDietaryNeeds(val)}
          options={DIETARY_OPTIONS}
          disabled={isLoading}
          icon={<Leaf size={18} />}
          placeholder="No Restrictions"
        />
      </div>

      <br />
      <div className="space-y-2">
        <label className="block text-m font-medium">
          Default Operating Hours
        </label>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Opening Time"
            type="time"
            icon={<Clock size={20} />}
            value={openTime}
            onChange={(e) =>
              handleFieldChange(e.target.value, setOpenTime, "openTime")
            }
            onBlur={() => handleBlur("openTime")}
            error={touched.openTime ? errors.openTime : undefined}
            disabled={isLoading}
          />
          <FormField
            label="Closing Time"
            type="time"
            icon={<Clock size={20} />}
            value={closeTime}
            onChange={(e) =>
              handleFieldChange(e.target.value, setCloseTime, "closeTime")
            }
            onBlur={() => handleBlur("closeTime")}
            error={touched.closeTime ? errors.closeTime : undefined}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Closed Days</label>
        <div className="flex flex-wrap gap-3">
          {[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ].map((day) => (
            <label
              key={day}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={closedDays.includes(day)}
                disabled={isLoading}
                onChange={(e) => {
                  if (e.target.checked) {
                    setClosedDays([...closedDays, day]);
                  } else {
                    setClosedDays(closedDays.filter((d) => d !== day));
                  }
                }}
              />
              {day}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-m font-medium text-bs-neutral-800 mb-2">
          Restaurant Location
        </label>
        <FormField
          label="Street Address"
          type="text"
          placeholder="eg. No. ..., Jalan..."
          value={street}
          onChange={(e) =>
            handleFieldChange(e.target.value, setStreet, "street")
          }
          onBlur={() => handleBlur("street")}
          error={touched.street ? errors.street : undefined}
          disabled={isLoading}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Postcode"
            type="text"
            placeholder="eg. 00000"
            value={postcode}
            onChange={(e) =>
              handleFieldChange(e.target.value, setPostcode, "postcode")
            }
            onBlur={() => handleBlur("postcode")}
            error={touched.postcode ? errors.postcode : undefined}
            disabled={isLoading}
          />
          <FormField
            label="City"
            type="text"
            placeholder="eg. Kuala Lumpur"
            value={city}
            onChange={(e) => handleFieldChange(e.target.value, setCity, "city")}
            onBlur={() => handleBlur("city")}
            error={touched.city ? errors.city : undefined}
            disabled={isLoading}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="State"
            type="text"
            placeholder="eg. Wilayah Persekutuan"
            value={state}
            onChange={(e) =>
              handleFieldChange(e.target.value, setState, "state")
            }
            onBlur={() => handleBlur("state")}
            error={touched.state ? errors.state : undefined}
            disabled={isLoading}
          />
          <FormField
            label="Country"
            type="text"
            placeholder="eg. Malaysia"
            value={country}
            onChange={(e) =>
              handleFieldChange(e.target.value, setCountry, "country")
            }
            onBlur={() => handleBlur("country")}
            error={touched.country ? errors.country : undefined}
            disabled={isLoading}
          />
        </div>
        Map status
        {isSearchingLocation && <>IsSearching</>}
        {latitude}
        {longitude}
        {(isSearchingLocation || (latitude && longitude)) && (
          <div className="mt-4 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-bs-neutral-500">
                Map Preview
              </span>
              {isSearchingLocation ? (
                <span className="text-xs text-bs-gold animate-pulse">
                  Locating on map...
                </span>
              ) : (
                <span className="text-xs text-green-600 font-medium">
                  ✓ Location Found
                </span>
              )}
            </div>

            <div className="w-full h-48 rounded-lg overflow-hidden border border-bs-neutral-200 bg-bs-neutral-50 flex items-center justify-center relative">
              {latitude && longitude ? (
                <iframe
                  title="Restaurant Location Map"
                  width="100%"
                  height="100%"
                  className="border-0"
                  src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                />
              ) : (
                <div className="text-xs text-bs-neutral-400 animate-pulse">
                  Loading map framework...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm text-bs-neutral-700 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) =>
              handleFieldChange(e.target.checked, setConsent, "consent")
            }
            className="mt-1"
            disabled={isLoading}
          />
          <span>I agree to the Privacy Policy and Terms of Service</span>
        </label>
        <p className="text-xs text-bs-neutral-500">
          By creating an account, you agree to how we process your data.{" "}
          <Link to="/privacy" className="text-bs-gold hover:underline">
            View Privacy Policy
          </Link>
        </p>
        {touched.consent && errors.consent && (
          <p className="text-xs text-bs-red font-medium">{errors.consent}</p>
        )}
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-green-100 border border-green-300 text-green-700 text-sm">
          Account created successfully! Redirecting to login...
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Create Restaurant Account"}
      </Button>

      <p className="text-center text-sm text-bs-neutral-600">
        Already have an account?{" "}
        <Link to="/login" className="text-bs-gold font-medium hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
