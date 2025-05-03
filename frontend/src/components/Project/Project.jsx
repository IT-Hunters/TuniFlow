import { Button, Box, Typography, Paper, Grid, IconButton, Tooltip } from '@mui/material';
import { VideoCall } from '@mui/icons-material';

const Project = () => {
  const handleCreateMeeting = () => {
    window.location.href = `/project/${projectId}/room`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">{project.name}</Typography>
          <Box>
            <Tooltip title="Créer/Rejoindre une réunion">
              <IconButton
                color="primary"
                onClick={handleCreateMeeting}
                sx={{ mr: 1 }}
              >
                <VideoCall />
              </IconButton>
            </Tooltip>
            {/* ... autres boutons existants ... */}
          </Box>
        </Box>
      </Paper>
      {/* ... reste du contenu ... */}
    </Box>
  );
}; 