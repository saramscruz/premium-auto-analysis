import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { trpc } from "../lib/trpc";

interface SetupForm {
  google_sheets_id: string;
  email_alerts_address: string;
  imap_host: string;
  imap_port: number;
  imap_user: string;
  imap_password: string;
}

export default function Setup() {
  const { data: config, isLoading } = trpc.config.get.useQuery();
  const update = trpc.config.update.useMutation();
  const testSheets = trpc.config.testSheets.useMutation();
  const initSheets = trpc.config.initSheets.useMutation();
  const utils = trpc.useUtils();

  const { register, handleSubmit, reset, watch, formState: { isSubmitting, isDirty } } =
    useForm<SetupForm>({
      defaultValues: {
        google_sheets_id: "",
        email_alerts_address: "",
        imap_host: "imap.gmail.com",
        imap_port: 993,
        imap_user: "",
        imap_password: "",
      },
    });

  useEffect(() => {
    if (config) {
      reset({
        google_sheets_id: config.google_sheets_id || "",
        email_alerts_address: config.email_alerts_address || "",
        imap_host: config.imap_host || "imap.gmail.com",
        imap_port: config.imap_port || 993,
        imap_user: config.imap_user || "",
        imap_password: "",
      });
    }
  }, [config, reset]);

  const onSubmit = async (data: SetupForm) => {
    await update.mutateAsync({
      google_sheets_id: data.google_sheets_id || undefined,
      email_alerts_address: data.email_alerts_address || undefined,
      imap_host: data.imap_host || undefined,
      imap_port: data.imap_port || undefined,
      imap_user: data.imap_user || undefined,
      imap_password: data.imap_password || undefined,
    });
    utils.config.get.invalidate();
  };

  const sheetsId = watch("google_sheets_id");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Setup &amp; Configuration</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Google Sheets</h2>
          <p className="text-sm text-gray-500 mb-4">
            Approved signals sync to your Signal Log spreadsheet automatically.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Sheets ID
              </label>
              <input
                {...register("google_sheets_id")}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Found in the URL: docs.google.com/spreadsheets/d/<strong>[ID]</strong>/edit
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => testSheets.mutate({ sheetsId: sheetsId })}
                disabled={!sheetsId || testSheets.isPending}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {testSheets.isPending ? "Testing..." : "Test Connection"}
              </button>
              {testSheets.data && (
                <span className={`flex items-center text-sm ${testSheets.data.ok ? "text-green-600" : "text-red-600"}`}>
                  {testSheets.data.ok ? "✅ Connected" : "❌ Connection failed"}
                </span>
              )}
              <button
                type="button"
                onClick={() => initSheets.mutate({ sheetsId: sheetsId })}
                disabled={!sheetsId || initSheets.isPending}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {initSheets.isPending ? "Initializing..." : "Initialize Headers"}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Google Alerts via Gmail IMAP</h2>
          <p className="text-sm text-gray-500 mb-4">
            Connect your Gmail to automatically fetch Google Alerts. Use an{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-500 hover:underline"
            >
              App Password
            </a>
            , not your regular password.
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Host</label>
                <input
                  {...register("imap_host")}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                <input
                  {...register("imap_port", { valueAsNumber: true })}
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gmail Address</label>
              <input
                {...register("imap_user")}
                type="email"
                placeholder="youremail@gmail.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Password</label>
              <input
                {...register("imap_password")}
                type="password"
                placeholder="xxxx xxxx xxxx xxxx"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Alert Notifications</h2>
          <p className="text-sm text-gray-500 mb-4">
            Where to send system health alerts and weekly reports.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alert Email</label>
            <input
              {...register("email_alerts_address")}
              type="email"
              placeholder="youremail@gmail.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="px-5 py-2.5 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Configuration"}
          </button>
          {update.isSuccess && !isDirty && (
            <span className="text-sm text-green-600">✅ Saved</span>
          )}
        </div>
      </form>

      <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-5">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Setup Guide</h3>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Create a Google Sheet for your Signal Log</li>
          <li>Share it with your service account email (from GOOGLE_SERVICE_ACCOUNT_JSON)</li>
          <li>Paste the Sheet ID above and click "Initialize Headers"</li>
          <li>Set up Google Alerts for: "Mercedes-Benz app", "BMW MyBMW", "Audi myAudi", "Volvo Cars app", "Porsche Connect app"</li>
          <li>Enter your Gmail IMAP credentials with an App Password</li>
          <li>Save &amp; go to Inbox — click "Check Alerts" to test</li>
        </ol>
      </div>
    </div>
  );
}
