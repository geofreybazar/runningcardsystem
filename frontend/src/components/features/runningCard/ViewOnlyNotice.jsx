import { Eye } from "lucide-react";
import useAuth from "@/hooks/auth/useAuth.js";

/** Why this user can't dispatch here: outside NCR, or another city's office owns it. */
function ViewOnlyNotice({ city }) {
  const { user } = useAuth();
  return (
    <div role='status' className='flex items-start gap-2 rounded-md border border-info/35 bg-info/10 px-3 py-2 text-sm text-info-foreground'>
      <Eye className='mt-0.5 size-4 shrink-0' />
      {!city
        ? "This location is outside Metro Manila."
        : user.dispatchCityId
          ? `View only: this location is in ${city.name}, outside your city. Dispatch is done by the ${city.name} office.`
          : `View only: dispatch for ${city.name} is done by the ${city.name} office.`}
    </div>
  );
}

export default ViewOnlyNotice;
