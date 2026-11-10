import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Page from "@/components/common/Page.jsx";
import AboutHero from "@/components/features/about/AboutHero.jsx";
import FeatureGrid from "@/components/features/about/FeatureGrid.jsx";
import AlarmGuide from "@/components/features/about/AlarmGuide.jsx";
import CreditsCard from "@/components/features/about/CreditsCard.jsx";

/** About the system. `publicView`: opened from the sign-in page, so no sidebar and no live settings. */
function AboutPage({ publicView = false }) {
  const content = (
    <Page title='About' description='What this system is, how it works, and who to contact.'>
      {publicView && (
        <div className='grid gap-1'>
          <Link to='/' className='flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'>
            <ChevronLeft className='size-4' /> Back to sign in
          </Link>
          {/* Signed out there is no top bar, so the page names itself. */}
          <h1 className='text-xl font-semibold tracking-tight'>About</h1>
        </div>
      )}
      <AboutHero />
      <FeatureGrid />
      <AlarmGuide signedIn={!publicView} />
      <CreditsCard />
    </Page>
  );
  return publicView ? <div className='mx-auto min-h-svh max-w-6xl bg-background'>{content}</div> : content;
}

export default AboutPage;
