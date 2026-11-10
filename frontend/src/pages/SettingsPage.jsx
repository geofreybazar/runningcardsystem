import Page from "@/components/common/Page.jsx";
import Panel from "@/components/common/Panel.jsx";
import SettingsForm from "@/components/features/settings/SettingsForm.jsx";

function SettingsPage() {
  return (
    <Page title='Settings' description='Apply to every running card generated after you save. Open incidents keep the card they were dispatched with.'>
      <Panel title='Running card rules' className='max-w-4xl' bodyClassName='p-4'>
        <SettingsForm />
      </Panel>
    </Page>
  );
}

export default SettingsPage;
