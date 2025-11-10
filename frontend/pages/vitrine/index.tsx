import type { GetServerSideProps } from 'next';

// Redirect legacy /vitrine routes to canonical public root handled by middleware -> /public-site
// This page exists only to keep old links working and to send a 301 to the canonical root.
export default function VitrineRedirect() {
  // Client never renders this — SSR redirect handles it.
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const host = (ctx.req.headers.host || '').toLowerCase();
  const protocol = (ctx.req.headers['x-forwarded-proto'] as string) || 'https';
  const destination = `${protocol}://${host}/`;
  return {
    redirect: {
      destination,
      permanent: true,
    }
  };
};
