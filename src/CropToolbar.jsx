import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import WallpaperOutlinedIcon from '@mui/icons-material/WallpaperOutlined';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { styled } from '@mui/material/styles';

const VisuallyHiddenInput = styled('input')({
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function CropToolbar({onLoadFile}) {

    return <Toolbar>
            <Button
        component="label"
        variant="contained"
        startIcon={<CloudUploadIcon />}>
            Upload File
        <VisuallyHiddenInput type="file" onChange={onLoadFile} />
        </Button>
        <Tooltip title="New crop">
            <IconButton color="primary" aria-label="New crop">
                <WallpaperOutlinedIcon />
            </IconButton>
        </Tooltip>

            <IconButton aria-label="open" color="primary">
                <RemoveCircleIcon />
            </IconButton>
        </Toolbar>
}