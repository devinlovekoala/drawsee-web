import { toSvg } from 'html-to-image';
import { Check, ImageDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function DownloadImgButton({element, size = 16, className}: {element: HTMLElement, size?: number, className?: string}) {

	const [downloaded, setDownloaded] = useState(false);

	const onDownload = async () => {
		if (!element) return;
		toSvg(element, {backgroundColor: 'transparent'}).then((url) => {
			setDownloaded(true);
			const a = document.createElement('a');
			a.setAttribute('download', 'node.svg');
			a.setAttribute('href', url);
			a.click();
			setTimeout(() => {
				setDownloaded(false);
			}, 1000);
		}).catch((error) => {
			toast.error('复制卡片为图片失败');
			console.error('复制卡片为图片失败', error);
		});
	};

  return (
    <button
			onClick={onDownload}
			className={`inline-flex rounded-md p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 ${className}`}
		>
			<ImageDown
        size={size}
        className={`transition-all
					${downloaded ? "scale-0" : "scale-100"}
				`}
      />
			<Check
        size={size}
        className={`absolute transition-all 
					${downloaded ? "scale-100" : "scale-0"
        }`}
      />
    </button>
  );
}

export default DownloadImgButton;
