import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

export function TelegramTest() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testConnection = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/upload-to-telegram/test`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to test connection');
      }

      toast({
        title: 'Success',
        description: `Connected to Telegram bot: ${result.bot_info.username}`,
      });
    } catch (error: any) {
      console.error('Error testing connection:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <Button 
        onClick={testConnection} 
        disabled={loading}
      >
        {loading ? 'Testing...' : 'Test Telegram Connection'}
      </Button>
    </div>
  );
} 