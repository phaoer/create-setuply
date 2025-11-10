interface Props {
	render: (...params: any[]) => React.ReactNode;
}

export default function Header({ render }: Props) {
	return <header data-tauri-drag-region>{render()}</header>;
}
