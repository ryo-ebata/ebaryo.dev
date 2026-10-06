import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Separator,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/atoms';

const meta = {
  title: 'Design System/Atoms/Overview',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActionsAndStatus: Story = {
  render: () => (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button disabled>Disabled</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        <Badge>Primary</Badge>
        <Badge variant="secondary">Draft</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="destructive">Error</Badge>
      </div>
    </div>
  ),
};

export const FieldsAndLoading: Story = {
  render: () => (
    <div className="grid max-w-xl gap-6">
      <label className="grid gap-2 text-sm">
        記事タイトル
        <Input placeholder="タイトルを入力" />
      </label>
      <label className="grid gap-2 text-sm">
        エラー
        <Input aria-invalid="true" defaultValue="修正が必要" />
      </label>
      <Separator />
      <div className="grid gap-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  ),
};

export const SurfaceAndData: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>公開コンポーネント</CardTitle>
          <CardDescription>意味のあるまとまりを一つの面に置く。</CardDescription>
        </CardHeader>
        <CardContent>カード本文</CardContent>
        <CardFooter>
          <Button size="sm">詳細を見る</Button>
        </CardFooter>
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Component</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Button</TableCell>
            <TableCell>
              <Badge variant="success">Stable</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};
