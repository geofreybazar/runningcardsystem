import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Page from "@/components/common/Page.jsx";
import SettingsForm from "@/components/features/settings/SettingsForm.jsx";

function SettingsPage() {
  return (
    <Page title='Settings'>
      <Card className='max-w-2xl'>
        <CardHeader>
          <CardTitle>Running card rules</CardTitle>
          <CardDescription>Apply to every running card generated after you save.</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm />
        </CardContent>
      </Card>
    </Page>
  );
}

export default SettingsPage;
