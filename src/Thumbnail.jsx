import ListItemButton from '@mui/material/ListItemButton';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

export function Thumbnail({imgSrc, width=120, height=80, selected, onSelect, onHighlight, onUnhighlight}) {
    return <ListItemButton
                disableRipple
                selected={selected}
                onClick={onSelect}
                divider={true}
                onMouseEnter={onHighlight}
                onMouseLeave={onUnhighlight}
                >
            <img src={imgSrc} width={width} height={height} />
            <Tooltip title="Download image">
                <IconButton color="primary" aria-label="Download image">
                    <FileDownloadIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton aria-label="Remove" color="primary">
                  <RemoveCircleIcon />
              </IconButton>
            </Tooltip>
          </ListItemButton>
}