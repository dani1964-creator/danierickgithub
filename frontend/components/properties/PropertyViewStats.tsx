import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, TrendingUp, Calendar, Users } from 'lucide-react';
import { usePropertyViews } from '@/hooks/usePropertyViews';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyViewStatsProps {
  propertyId: string;
  propertyTitle?: string;
}

export const PropertyViewStats = ({ propertyId, propertyTitle }: PropertyViewStatsProps) => {
  const { getViewStats } = usePropertyViews();
  const [stats, setStats] = useState<{
    total_views: number;
    unique_views: number;
    today_views: number;
    week_views: number;
    month_views: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const result = await getViewStats(propertyId);
      setStats(result);
      setLoading(false);
    };

    fetchStats();
  }, [propertyId, getViewStats]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Estatísticas de Visualizações
          </CardTitle>
          {propertyTitle && <CardDescription>{propertyTitle}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Estatísticas de Visualizações
        </CardTitle>
        {propertyTitle && <CardDescription>{propertyTitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total de Visualizações */}
          <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold">{stats.total_views}</div>
            <p className="text-xs text-muted-foreground mt-1">Todas as visualizações</p>
          </div>

          {/* Visualizações Únicas */}
          <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Únicas</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.unique_views}</div>
            <p className="text-xs text-muted-foreground mt-1">IPs únicos</p>
          </div>

          {/* Hoje */}
          <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Hoje</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.today_views}</div>
            <p className="text-xs text-muted-foreground mt-1">Últimas 24h</p>
          </div>

          {/* Última Semana */}
          <div className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">7 dias</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.week_views}</div>
            <p className="text-xs text-muted-foreground mt-1">Última semana</p>
          </div>
        </div>

        {/* Taxa de Conversão de Visualizações Únicas */}
        {stats.total_views > 0 && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taxa de Visualizações Únicas</span>
              <span className="text-sm font-bold text-primary">
                {((stats.unique_views / stats.total_views) * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.unique_views} IPs únicos de {stats.total_views} visualizações totais
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
