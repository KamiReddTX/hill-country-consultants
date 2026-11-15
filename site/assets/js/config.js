/* DBW News — site configuration.

   supabaseUrl / supabaseKey: from the Supabase dashboard, Project Settings →
   API. The key is the PUBLISHABLE (anon) key, which is safe in a browser:
   what it can read is decided by the row-level security in
   supabase/migrations. Never put the service-role key here.

   Left blank, the site still renders: everyone reads as a visitor and the
   archive shows the issue calendar without imported articles. */
window.DBW_CONFIG = {
  supabaseUrl: "",
  supabaseKey: "",

  // Every cross-page link in one place, so pages that are not built yet are
  // easy to find and repoint. Paths are relative to the site root.
  routes: {
    home: "index.html",
    subscribe: "shop.html",
    signIn: "sign-in.html",
    createAccount: "sign-in.html#create",
    createOnline: "sign-in.html#create-online",
    upgrade27: "sign-in.html#upgrade-27",
    account: "member-profile.html",
    letters: "letters.html",
    issueArchive: "issue-archive.html",
    // "What is in it" for an issue. The design pointed at the Theme Calendar,
    // which was later moved into the newsroom portal as an internal page.
    issueContents: function (ym) { return "issues/" + ym + ".html"; }
  }
};
