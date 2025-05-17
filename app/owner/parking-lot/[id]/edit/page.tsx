// app/owner/parking-lot/[id]/edit/page.tsx

import EditParkingLotForm from './EditParkingLotForm';
import { Metadata } from 'next';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Edit Parking Lot',
};

export default function EditParkingLotPage({ params }: PageProps) {
  const { id } = use(params);
  return <EditParkingLotForm parkingLotId={id} />;
}
